export const Paths = {
  icons: (name: string) => `/icons/icons.svg#icons.${name}`,
  brandIcons: (name: string) => `/icons/brands.svg#icons.${name}`,
  images: (name: string, size: string = '100x100', extension: string = 'png') =>
    `/images/${name}.${size}.${extension}`,
  games: (id: string, name: string) => `/images/games/${id}/${name}.svg`,
  gif: (name: string) => `/gifs/${name}.svg`,
};

export default Paths;
