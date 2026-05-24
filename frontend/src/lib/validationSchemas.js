import { z } from 'zod';

const emailSchema = z.string().trim().email('Enter a valid email address').transform((value) => value.toLowerCase());

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Full name is required'),
  rollNumber: z.string().trim().min(1, 'Roll number is required').transform((value) => value.toUpperCase()),
  branch: z.string().min(1, 'Branch is required'),
  section: z.string().min(1, 'Section is required'),
  subsection: z.string().min(1, 'Subsection is required'),
  email: emailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

export const studentSettingsSchema = z.object({
  semester: z.coerce.number().int().min(1).max(8),
});

export const hodRegistrationFormSchema = z.object({
  title: z.string().trim().min(3, 'Title is required'),
  academic_year: z.string().trim().min(1, 'Academic year is required'),
  semester: z.coerce.number().int().min(1).max(8),
  section: z.string().trim().min(1, 'Section is required'),
  subsection: z.string().trim().optional(),
  team_size_min: z.coerce.number().int().min(1).max(4),
  team_size_max: z.coerce.number().int().min(1).max(4),
}).refine((data) => data.team_size_max >= data.team_size_min, {
  path: ['team_size_max'],
  message: 'Max team size must be greater than or equal to min team size',
});

export const projectMemberSchema = z.object({
  name: z.string().trim().optional(),
  email: z.string().trim().optional().transform((value) => value ? value.toLowerCase() : ''),
  roll_number: z.string().trim().optional().transform((value) => value ? value.toUpperCase() : ''),
});

export const studentProjectRegistrationSchema = z.object({
  project_title: z.string().trim().min(3, 'Project title is required'),
  project_domain: z.string().trim().min(2, 'Project domain is required'),
  problem_statement: z.string().trim().min(10, 'Problem statement is required'),
  abstract: z.string().trim().min(10, 'Abstract is required'),
  tech_stack: z.string().trim().optional(),
  members: z.array(projectMemberSchema),
});

export const mentorMilestoneSchema = z.object({
  title: z.string().trim().min(2, 'Milestone title is required'),
  description: z.string().trim().optional(),
  deadline: z.string().trim().min(1, 'Deadline is required'),
  project_id: z.coerce.number().int().positive('Project is required'),
});
