db = new Mongo().getDB("simplelib");

db.createCollection("books");
db.createCollection("loans");

db.books.createIndex({ isbn: 1 }, { unique: true });
db.books.createIndex(
    {
        author: "text",
        description: "text",
        format: "text",
        location: "text",
        publisher: "text",
        title: "text"
    },
    {
        name: "text_search_index"
    }
);
