CREATE TABLE companies(
    id serial PRIMARY KEY,
    ticker text UNIQUE,
    cik int UNIQUE,
    name text,
    created_at timestamp DEFAULT now()
);

CREATE TABLE filings(
    id serial PRIMARY KEY,
    company_id int REFERENCES companies(id),
    form_file varchar(255),
    reporting_for date,
    filed_at date,
    filing_period varchar(10),
    filing_type varchar(10),
    url varchar(255),
    created_at timestamp DEFAULT now()
);

CREATE TABLE excerpts(
    id serial PRIMARY KEY,
    filing_id int REFERENCES filings(id),
    index int,
    title text,
    category varchar(255),
    subcategory varchar(255),
    sentiment varchar(255),
    excerpt text,
    insight text,
    embedding VECTOR(1536),
    category_embedding VECTOR(1536),
    created_at timestamp DEFAULT now(),
    UNIQUE (filing_id, INDEX)
);

CREATE TABLE tags(
    id serial PRIMARY KEY,
    excerpt_id int REFERENCES excerpts(id),
    tag varchar(255),
    embedding VECTOR(1536),
    created_at timestamp DEFAULT now()
);

