export const fetchFishes = async () => {
  const response = await fetch("http://localhost:5555/api/fish");
  const data = await response.json();
  return data;
};

export const addFishToDex = async (fishId: string) => {
  const response = await fetch("/api/fishdex", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fishId }),
  });
};

export const removeFishFromDex = async (fishId: string) => {
  const response = await fetch(`/api/fishdex/${fishId}`, {
    method: "DELETE",
  });
};