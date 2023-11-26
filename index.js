import express from 'express';

const pushpinPrefix = process.env.PUSHPIN_PREFIX || '/api/pushpin*';
const originServerUrl = process.env.ORIGIN_SERVER_URL || 'http://localhost:5173';

const app = express();
const port = 3000;

const appControlPlane = express();
const portControlPlane = 3001;

let clientIdCounter = 0;

// Map to store channels and their respective subscribers
const channelSubscribers = new Map();

// Add Access-Control-Allow-Origin middleware that allows all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

app.get('/', (req, res) => res.send('MiniPin v0'));

app.get(pushpinPrefix, async (req, res) => {
  try {
    const forwardedHeaders = { ...req.headers };

    const newRequest = new Request(`${originServerUrl}${req.url}`, req);
    //console.log(newRequest);

    // Fetch request to the origin server
    const originResponse = await fetch(newRequest, {
      method: 'GET',
      headers: forwardedHeaders
    });

    const gripChannelHeader = originResponse.headers.get('Grip-Channel');
    const requestChannels = gripChannelHeader ? gripChannelHeader.split(',') : [];
    const keepAliveHeader = originResponse.headers.get('Grip-Keep-Alive');
    const keepAliveConfig = parseGripKeepAliveHeader(keepAliveHeader);

    if (originResponse.ok) {
      const clientId = clientIdCounter++;

      // TODO: Server should initialize the connection right away like PushPin instead
      // of waiting for the first message or keep-alive to be sent

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store', // TODO: or no-cache?
        // 'Connection': 'keep-alive'
      });

      console.log('Connected client:', clientId);

      const sendData = (data) => {
        // console.log('Sending data to client:', clientId, data);
        res.write(data);
      };

      let keepAliveInterval;
      if (keepAliveConfig) {
        keepAliveInterval = setInterval(() => {
          console.log('Sending keep-alive message to client:', clientId);
          sendData(`${keepAliveConfig.content}\n`); // Sending a comment to keep the connection alive
          //sendData(`\n\n`); // Sending a keep-alive event
        }, keepAliveConfig.timeout * 1000);
      }

      requestChannels.forEach(channelId => {
        if (!channelSubscribers.has(channelId)) {
          channelSubscribers.set(channelId, new Map());
        }
        const channelClients = channelSubscribers.get(channelId);
        channelClients.set(clientId, { sendData });
      });

      req.on('close', () => {
        console.log('Disconnected client:', clientId);
        clearInterval(keepAliveInterval);
        // Unsubscribe client from channels on disconnect
        requestChannels.forEach(channelId => {
          const channelClients = channelSubscribers.get(channelId);
          channelClients.delete(clientId);

          // If no clients left in the channel, delete the channel entry
          if (channelClients.size === 0) {
            channelSubscribers.delete(channelId);
          }
        });
      });

      console.log('Clients', channelSubscribers);
    } else {
      const body = await originResponse.text();
      res.status(originResponse.status).send(body);
    }
  } catch (error) {
    console.error('Error communicating with origin server:', error);
    res.status(500).send('Internal Server Error');
  }
});

function broadcastMessage(channel, message) {
  if (channelSubscribers.has(channel)) {
    const channelClients = channelSubscribers.get(channel);
    channelClients.forEach(client => {
      client.sendData(message);
    });
  } else {
    console.log(`Channel ${channel} has no subscribers`);
  }
}

app.listen(port, () => {
  console.log(`http://localhost:${port} - MiniPin server`);
});

/* Control plane */

appControlPlane.use(express.json());

appControlPlane.post('/publish', (req, res) => {
  try {
    if (!req.body.items) {
      res.status(400).send('Bad Request');
      return;
    }

    req.body.items.forEach(item => {
      const channel = item.channel;
      const content = item.formats['http-stream'].content;

      console.log(`Publishing message to channel ${channel}:`, JSON.stringify(content));

      broadcastMessage(channel, content);
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error publishing message:', error);
    res.status(500).send('Internal Server Error');
  }
});

appControlPlane.listen(portControlPlane, () => {
  console.log(`http://localhost:${portControlPlane} - MiniPin control plane`);
});

function parseGripKeepAliveHeader(header) {
  if (!header || typeof header !== 'string') {
    return null;
  }

  const parts = header.split(';').map(part => part.trim());
  if (parts.length < 2) {
    // Header must contain at least content and one other part (format or timeout)
    return null;
  }

  const result = {};

  // Assuming the first part is always the content
  result.content = parts[0].replace(/^\\n/, '\n'); // Unescape newline if needed

  let formatFound = false;
  let timeoutFound = false;

  parts.slice(1).forEach(part => {
    const [key, value] = part.split('=').map(p => p.trim());
    if (key === 'format' && value) {
      result.format = value;
      formatFound = true;
    } else if (key === 'timeout') {
      const timeoutValue = parseInt(value, 10);
      if (!isNaN(timeoutValue) && timeoutValue > 0) {
        result.timeout = timeoutValue;
        timeoutFound = true;
      }
    }
  });

  // Return null if either format or timeout is missing or invalid
  if (!formatFound || !timeoutFound) {
    return null;
  }

  return result;
}