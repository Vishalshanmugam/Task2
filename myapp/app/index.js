const express = require('express');
const { MongoClient } = require('mongodb');
const k8s = require('@kubernetes/client-node');

const app = express();
app.use(express.json());

const mongoHost = process.env.MONGO_HOST || 'localhost';
const mongoPort = process.env.MONGO_PORT || '27017';
const mongoUser = process.env.MONGO_USER || 'admin';
const mongoPass = process.env.MONGO_PASSWORD || 'password';

const mongoUrl = `mongodb://${mongoUser}:${mongoPass}@${mongoHost}:${mongoPort}`;

let db;
MongoClient.connect(mongoUrl)
  .then(client => {
    db = client.db('mydb');
    console.log('Connected to MongoDB');
  })
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/tasks', async (req, res) => {
  const tasks = await db.collection('tasks').find({}).toArray();
  res.json(tasks);
});

app.put('/taskexecution', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).send('No command provided');

  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

  const podName = `task-exec-${Date.now()}`;
  const podManifest = {
    metadata: { name: podName },
    spec: {
      containers: [{ name: 'task-exec', image: 'busybox', command: ['sh', '-c', command] }],
      restartPolicy: 'Never'
    }
  };

  try {
    await k8sApi.createNamespacedPod('default', podManifest);
    res.json({ message: `Pod ${podName} created to run command: ${command}` });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create pod');
  }
});

app.listen(3000, () => console.log('App running on port 3000'));

