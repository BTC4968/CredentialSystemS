import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { prisma } from './db';
import { UserRole } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const SALT_ROUNDS = 12;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
  } catch (error) {
    return null;
  }
}

/**
 * Get user from request headers (JWT token)
 */
export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(credentials: LoginCredentials): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email }
  });

  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(credentials.password, user.password);
  
  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

/**
 * Create a new user
 */
export async function createUser(credentials: RegisterCredentials): Promise<AuthUser> {
  const hashedPassword = await hashPassword(credentials.password);
  
  const user = await prisma.user.create({
    data: {
      name: credentials.name,
      email: credentials.email,
      password: hashedPassword,
      role: credentials.role || UserRole.USER
    }
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

/**
 * Check if user exists by email
 */
export async function userExists(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  return !!user;
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

/**
 * Middleware to require authentication
 */
export function requireAuth(handler: (req: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handler(req, user);
  };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(handler: (req: NextRequest, user: AuthUser) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    const user = await getUserFromRequest(req);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (user.role !== UserRole.ADMIN) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return handler(req, user);
  };
}
