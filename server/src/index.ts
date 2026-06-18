import app from './app';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8842;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
});
