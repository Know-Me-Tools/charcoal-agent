## ADDED Requirements

### Requirement: Product pages are readable without JavaScript
A request for /products or /products/<slug> SHALL return a response whose body contains that page's title and main text without executing JavaScript, and the site SHALL publish a sitemap.xml listing those URLs.

#### Scenario: A crawler sees the page
- **WHEN** a request is made without JavaScript for a product page
- **THEN** the response contains the page title and its status text

#### Scenario: The sitemap lists the pages
- **WHEN** sitemap.xml is fetched
- **THEN** it lists /products and each product slug
