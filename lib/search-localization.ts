const SEARCH_LABELS = {
  es: {
    Type: "Tipo",
    Title: "Título",
    Description: "Descripción",
    Tag: "Etiqueta",
    Body: "Contenido",
    Author: "Autoría",
    Style: "Estilo",
    Country: "País",
    Date: "Fecha",
    Image: "Imagen",
    Post: "Ensayo",
    Page: "Página",
    Painting: "Pintura",
  },
  ru: {
    Type: "Тип",
    Title: "Название",
    Description: "Описание",
    Tag: "Тег",
    Body: "Содержание",
    Author: "Автор",
    Style: "Стиль",
    Country: "Страна",
    Date: "Дата",
    Image: "Изображение",
    Post: "Эссе",
    Page: "Страница",
    Painting: "Картина",
  },
} as const;

export function localizeSearchDocument(content: string, locale: string) {
  if (locale !== "es" && locale !== "ru") return content;

  return Object.entries(SEARCH_LABELS[locale]).reduce(
    (localized, [source, target]) =>
      localized.replace(new RegExp(`^${source}$`, "gm"), target),
    content,
  );
}
