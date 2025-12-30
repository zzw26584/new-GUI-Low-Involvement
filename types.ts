

export enum Stage {
  PARTICIPANT_INFO = 'PARTICIPANT_INFO',
  INTRO = 'INTRO',
  LEVEL1 = 'LEVEL1',
  LEVEL2 = 'LEVEL2',
  FINISH = 'FINISH',
  EXPERIMENT_COMPLETE = 'EXPERIMENT_COMPLETE'
}

export interface ProductAttribute {
  label: string;
  value: string | number;
  isHighlight?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  rating: number;
  summary: string;
  attributes: ProductAttribute[];
  rooms?: any[]; 
  reviews?: string[];
}

export interface TrialConfig {
  id: number;
  type: string;
  objectCount: number;
  dimensionCount: number;
  instruction: string;
  reminder: string;
  products: Product[];
}

export interface ParticipantInfo {
  id: string;
  runNumber: string;
  gender: '男' | '女' | '';
  age: string;
}

export interface SurveyData {
  importance: number;
  skillLevel: number;
  timeSpent: string;
  satisfaction: number;
  efficiency: number;
  trust: number;
}

export interface TrialResult {
  Participant_ID: string;
  Run_Number: string;
  Gender: string;
  Age: string;
  Trial_ID: number;
  Trial_Type: string;
  Condition_N: number;
  Condition_D: number;
  Choice_Name: string;
  Duration_Seconds: number;
  Backtrack_Count: number;
  Filter_Clicks: number;
  Importance: number;
  Skill_Level: number;
  Satisfaction: number;
  Efficiency: number;
  Trust: number;
  Daily_Time_Spent: string;
}

// Fix: Added ViewType enum to resolve compilation error in Sidebar and ChatView
export enum ViewType {
  CHAT = 'CHAT',
  SEARCH = 'SEARCH',
  IMAGE = 'IMAGE',
  SPEECH = 'SPEECH'
}

// Fix: Added Message interface to resolve compilation error in ChatView
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  groundingUrls?: { uri: string; title: string }[];
}

// Fix: Added GeneratedImage interface to resolve compilation error in ImageGenView
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}
