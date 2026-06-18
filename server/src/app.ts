import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import routes from './routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.path,
    method: req.method,
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || '服务器内部错误',
  });
});

export default app;
