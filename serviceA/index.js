const express = require('express');
const axios = require('axios');
const wrapAxios = require('zipkin-instrumentation-axiosjs');
const {Tracer, ExplicitContext, BatchRecorder, jsonEncoder: {JSON_V2}} = require('zipkin');
const {HttpLogger} = require('zipkin-transport-http');

const app = express();
const port = 3000;

// Setup the tracer with ExplicitContext
const tracer = new Tracer({
  ctxImpl: new ExplicitContext(), // Use ExplicitContext for in-process context
  recorder: new BatchRecorder({
    logger: new HttpLogger({
      endpoint: 'http://203.123.85.49:9411/api/v2/spans', // Zipkin endpoint
      jsonEncoder: JSON_V2,
    }),
  }),
  localServiceName: 'service-a', // Name of this service
});

// Wrap Axios with Zipkin instrumentation
const remoteServiceName = 'service-b';
const zipkinAxios = wrapAxios(axios, {tracer, remoteServiceName});

app.get('/call-service-b', async (req, res) => {
  try {
    const response = await zipkinAxios.get('http://localhost:3001/service-b');
    res.send(`Service A received: ${response.data}`);
  } catch (error) {
    console.error('Error calling Service B:', error.message);
    res.status(500).send('Error calling Service B');
  }
});

app.listen(port, () => {
  console.log(`Service A is running on http://localhost:${port}`);
});
