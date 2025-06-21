import { config } from 'dotenv';
config();

import '@/ai/flows/content-filtering.ts';
import '@/ai/flows/pdf-taxonomy-generation.ts';
import '@/ai/flows/summary-generation.ts';