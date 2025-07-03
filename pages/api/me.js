import { verifyToken } from '../../lib/auth';
import * as cookie from 'cookie';

export default function handler(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies.token || null;
  const decoded = token ? verifyToken(token) : null;

  if (!decoded) {
    return res.status(401).json({ user: null });
  }

  res.status(200).json({ user: decoded });
}
