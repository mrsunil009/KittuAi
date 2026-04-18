import axios from 'axios';

const blackboxApi = axios.create({
  baseURL: 'https://api.blackbox.com', // Replace with actual base URL
  headers: {
    'Authorization': `Bearer YOUR_API_KEY`, // Replace with actual API key
  },
});

export const fetchData = async () => {
  try {
    const response = await blackboxApi.get('/data');
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
};