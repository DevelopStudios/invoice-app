const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();

app.use(cors());
app.use(express.json());

const DATA_PATH = '../public/assets/data.json';

app.get('/api/invoices', (req, res) => {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading data');
    res.json(JSON.parse(data));
  });
});

app.post('/api/invoices',(req, res) => {
  const newInvoice = req.body;
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading file');
    const invoices = JSON.parse(data);
    invoices.push(newInvoice);
    fs.writeFile(DATA_PATH, JSON.stringify(invoices, null, 2), (err) => {
      if (err) return res.status(500).send('Error saving file');
      res.status(201).json(newInvoice); // 201 Created
    });
  });
});

app.put('/api/invoices/:id', (req, res) => {
  const { id } = req.params;
  const updatedInvoice = req.body;

  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading file');
    let invoices = JSON.parse(data);
    const index = invoices.findIndex(inv => inv.id === id);
    if (index === -1) return res.status(404).send('Invoice not found');
    invoices[index] = { ...invoices[index], ...updatedInvoice };
    fs.writeFile(DATA_PATH, JSON.stringify(invoices, null, 2), (err) => {
      if (err) return res.status(500).send('Error saving file');
      res.status(200).send(invoices[index]);
    });
  });
});

app.delete('/api/invoices/:id', (req, res) => {
  const { id } = req.params;

  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading file');
    
    let invoices = JSON.parse(data);
    const filteredInvoices = invoices.filter(inv => inv.id !== id);

    fs.writeFile(DATA_PATH, JSON.stringify(filteredInvoices, null, 2), (err) => {
      if (err) return res.status(500).send('Error saving file');
      res.status(200).send({ message: 'Invoice deleted successfully' });
    });
  });
});

app.listen(3000, () => console.log('API running on http://localhost:3000'));