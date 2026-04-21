import { doc, setDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";

export const toggleFavorite = async (uid: string, countryId: string, isAdding: boolean) => {
  const userRef = doc(db, "users", uid);
  await setDoc(userRef, {
    favorites: isAdding ? arrayUnion(countryId) : arrayRemove(countryId)
  }, { merge: true });
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
  await setDoc(userRef, {
    finance_wishlist: isAdding ? arrayUnion(symbol) : arrayRemove(symbol)
  }, { merge: true });
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
