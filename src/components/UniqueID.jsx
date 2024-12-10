import { useEffect, useState } from "react";

const useUniqueUserId = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storageKey = "uniqueUserId";
    let uniqueId = localStorage.getItem(storageKey);

    if (!uniqueId) {
      uniqueId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, uniqueId);
    }

    setUserId(uniqueId);
  }, []);

  return userId;
};

export default useUniqueUserId;