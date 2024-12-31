const express = require('express');
const fetch = require('node-fetch');
const wrapFetch = require('zipkin-instrumentation-fetch');
const {Tracer, ExplicitContext, BatchRecorder, jsonEncoder: {JSON_V2}} = require('zipkin');
const {HttpLogger} = require('zipkin-transport-http');

const app = express();
const port = 3001;

// Setup the tracer with ExplicitContext
const tracer = new Tracer({
  ctxImpl: new ExplicitContext(), // Use ExplicitContext for in-process context
  recorder: new BatchRecorder({
    logger: new HttpLogger({
      endpoint: 'http://203.123.85.49:9411/api/v2/spans', // Zipkin endpoint
      jsonEncoder: JSON_V2,
    }),
  }),
  localServiceName: 'service-b', // Name of this service
});

// Wrap Fetch with Zipkin instrumentation
const remoteServiceName = 'external-api';
const zipkinFetch = wrapFetch(fetch, {tracer, remoteServiceName});

app.get('/service-b', async (req, res) => {
  try {
    const response = await zipkinFetch('https://jsonplaceholder.typicode.com/posts/1');
    const data = await response.json();
    res.send(`Service B fetched data: ${JSON.stringify(data)}`);
  } catch (error) {
    console.error('Error fetching external API:', error.message);
    res.status(500).send('Error fetching external API');
  }
});

app.listen(port, () => {
  console.log(`Service B is running on http://localhost:${port}`);
});
