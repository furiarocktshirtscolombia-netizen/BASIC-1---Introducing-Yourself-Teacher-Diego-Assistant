export interface Level {
  id: number;
  title: string;
  questions: string[];
}

export const LEVELS: Level[] = [
  {
    id: 1,
    title: "Personal Information",
    questions: [
      "What's your name?",
      "How old are you?",
      "Where are you from?",
      "Where do you live?"
    ]
  },
  {
    id: 2,
    title: "Daily Life",
    questions: [
      "What do you do?",
      "Are you a student?",
      "What time do you wake up?"
    ]
  },
  {
    id: 3,
    title: "Likes and Dislikes",
    questions: [
      "What do you like?",
      "What is your favorite food?",
      "What is your favorite color?",
      "Do you like English?"
    ]
  },
  {
    id: 4,
    title: "Simple Descriptions",
    questions: [
      "Describe your house.",
      "Describe your family."
    ]
  }
];
