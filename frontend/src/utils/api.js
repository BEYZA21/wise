const getBaseUrl = () => {
    const envUrl = process.env.REACT_APP_API_URL;
  
    if (envUrl && envUrl !== "auto") {
      return envUrl;
    }
  
    const hostname = window.location.hostname;
  
    if (hostname === "localhost") {
      return "http://localhost:8000/api/";
    }
  
    // Canlı sunucu
    return "https://wise-pr89.onrender.com/api/";
  };
  
  export const API_URL = getBaseUrl();
  