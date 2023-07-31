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
    created_at timestamp DEFAULT now()
);

CREATE TABLE excerpts(
    id serial PRIMARY KEY,
    filing_id int REFERENCES filings(id),
    title varchar(255),
    category varchar(255),
    subcategory varchar(255),
    sentiment varchar(255),
    excerpt text,
    embedding VECTOR(1536),
    created_at timestamp DEFAULT now()
);

CREATE TABLE tags(
    id serial PRIMARY KEY,
    excerpt_id int REFERENCES excerpts(id),
    tag varchar(255),
    embedding VECTOR(1536),
    created_at timestamp DEFAULT now()
);

