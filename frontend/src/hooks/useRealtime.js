import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database, isConfigured } from '../config/firebase';
import { api } from '../services/api';

export function useRealtime(path, pollEndpoint, interval = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchApi = useCallback(async () => {
    if (!pollEndpoint) return;
    try {
      const res = await api.get(pollEndpoint);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pollEndpoint]);

  useEffect(() => {
    if (isConfigured && database && path) {
      const dbRef = ref(database, path);
      const handler = onValue(dbRef, (snap) => {
        setData(snap.val());
        setLoading(false);
      });
      return () => off(dbRef, 'value', handler);
    }
    fetchApi();
    const id = setInterval(fetchApi, interval);
    return () => clearInterval(id);
  }, [path, fetchApi, interval]);

  return { data, loading, refresh: fetchApi };
}
