using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Chronicle.Infrastructure.Data.Migrations
{
    /// <summary>
    /// Adds a stored full-text search vector to articles, plus the index that makes it
    /// worth having.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Written as raw SQL rather than through the model. Npgsql can generate a tsvector
    /// column from a mapped property, but that property would have to be an
    /// <c>NpgsqlTsVector</c> on the <c>Post</c> entity — a package reference in
    /// <c>Chronicle.Domain</c>, which has none and is asserted by test to have none. The
    /// column is a database concern, so it is declared where database concerns live.
    /// </para>
    /// <para>
    /// <b>GENERATED ALWAYS ... STORED</b>: PostgreSQL recomputes the vector as part of
    /// every write, so it cannot drift from the text it was built from. A trigger would
    /// do the same job with more to go wrong, and computing it on read would mean
    /// re-parsing every article body on every keystroke.
    /// </para>
    /// <para>
    /// The three fields are weighted: a term in the title (A) outranks one in the excerpt
    /// (B), which outranks one buried in the body (C). Without weights, an article that
    /// mentions a word once in passing ranks alongside the article about it.
    /// </para>
    /// </remarks>
    public partial class ArticleFullTextSearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE knowledge_posts
                ADD COLUMN "SearchVector" tsvector
                GENERATED ALWAYS AS (
                    setweight(to_tsvector('english', coalesce("Title", '')), 'A') ||
                    setweight(to_tsvector('english', coalesce("Excerpt", '')), 'B') ||
                    setweight(to_tsvector('english', coalesce("BodyMarkdown", '')), 'C')
                ) STORED;
                """);

            // GIN rather than GiST: this index is read far more than written, and GIN is
            // the faster of the two for lookups at the cost of a slower build.
            migrationBuilder.Sql(
                """
                CREATE INDEX "IX_knowledge_posts_SearchVector"
                ON knowledge_posts USING GIN ("SearchVector");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""DROP INDEX IF EXISTS "IX_knowledge_posts_SearchVector";""");
            migrationBuilder.Sql("""ALTER TABLE knowledge_posts DROP COLUMN IF EXISTS "SearchVector";""");
        }
    }
}
