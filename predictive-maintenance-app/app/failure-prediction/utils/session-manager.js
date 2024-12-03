import { v4 as uuidv4 } from 'uuid';

let sessionId = uuidv4();

export const getSessionId = () => sessionId;
export const resetSessionId = () => {
  sessionId = uuidv4();
};
