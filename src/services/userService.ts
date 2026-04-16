import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export const toggleFavorite = async (uid: string, countryId: string, isAdding: boolean) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, { favorites: [] });
  }

  await updateDoc(userRef, {
    favorites: isAdding ? arrayUnion(countryId) : arrayRemove(countryId)
  });
};

export const subscribeToFavorites = (uid: string, callback: (favs: string[]) => void) => {
  const userRef = doc(db, "users", uid);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().favorites || []);
    } else {
      callback([]);
    }
  });
};

export const toggleFinanceFavorite = async (uid: string, symbol: string, isAdding: boolean) => {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, { finance_wishlist: [] });
  }

  await updateDoc(userRef, {
    finance_wishlist: isAdding ? arrayUnion(symbol) : arrayRemove(symbol)
  });
};

export const subscribeToFinanceFavorites = (uid: string, callback: (favs: string[]) => void) => {
  const userRef = doc(db, "users", uid);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data().finance_wishlist || []);
    } else {
      callback([]);
    }
  });
};
