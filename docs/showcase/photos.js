/* Local photos; credits in assets/photos.json and THIRD_PARTY_NOTICES.md. */
export const photos = [
  {id:'lake', label:'Alpine lake', author:'Simon Hurry', source:'https://unsplash.com/photos/lake-near-mountain-under-blue-sky-during-daytime-jAAk__SlP8U'},
  {id:'coast', label:'Coast', author:'Rahul Chakraborty', source:'https://unsplash.com/photos/aerial-view-of-ocean-waves-UB9qK0nkRPs'},
  {id:'architecture', label:'Architecture', author:'Joshua Chai', source:'https://unsplash.com/photos/white-concrete-high-rise-building-weurBA3Pyts'},
].map(photo => ({...photo, src:new URL(`./assets/${photo.id}.jpg`, import.meta.url).href}));
const decoded = new Map();
export function loadPhoto(id) {
  const photo = photos.find(photo => photo.id === id) || photos[0];
  if (!decoded.has(photo.id)) {
    const picture = new Image(); picture.src = photo.src;
    decoded.set(photo.id, picture.decode().then(() => photo).catch(error => {decoded.delete(photo.id); throw error;}));
  }
  return decoded.get(photo.id);
}
