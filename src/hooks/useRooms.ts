/**
 * useRooms Hook - Realtime listener
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Room } from '../../types';

interface UseRoomsReturn {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  createRoom: (data: Omit<Room, 'id'>) => Promise<string>;
  updateRoom: (id: string, data: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
}

export const useRooms = (): UseRoomsReturn => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      collection(db, 'rooms'),
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Room[];
        setRooms(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Không thể tải danh sách phòng học');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const createRoom = async (data: Omit<Room, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'rooms'), data);
    return docRef.id;
  };

  const updateRoom = async (id: string, data: Partial<Room>): Promise<void> => {
    await updateDoc(doc(db, 'rooms', id), data);
  };

  const deleteRoom = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'rooms', id));
  };

  return {
    rooms,
    loading,
    error,
    createRoom,
    updateRoom,
    deleteRoom,
  };
};
