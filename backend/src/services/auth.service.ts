import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserModel } from '../models/user.model';
import { signToken } from '../utils/jwt';
import { BadRequest, Conflict, Unauthorized } from '../utils/errors';
import { safeText } from '../utils/text';

export const registerSchema = z.object({
  name: safeText(2, 120),
  email: z.string().email(),
  password: z.string().min(6).max(120),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export async function register(input: RegisterInput) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) throw BadRequest('Invalid payload', parsed.error.flatten());

  const exists = await UserModel.findOne({ where: { email: parsed.data.email } });
  if (exists) throw Conflict('Email already registered');

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await UserModel.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
  });
  return publicUser(user);
}

export async function login(input: LoginInput) {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) throw BadRequest('Invalid payload', parsed.error.flatten());

  const user = await UserModel.findOne({ where: { email: parsed.data.email } });
  if (!user) throw Unauthorized('Invalid credentials');

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) throw Unauthorized('Invalid credentials');

  const token = signToken({ sub: user.id, email: user.email });
  return { token, user: publicUser(user) };
}

function publicUser(u: UserModel) {
  return { id: u.id, name: u.name, email: u.email };
}
