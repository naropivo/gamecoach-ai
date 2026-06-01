const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000; // Railway часто требует порт 3000 или 8080

// Раздаем статику из папки frontend/dist
app.use(express.static(path.join(__dirname, 'frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));