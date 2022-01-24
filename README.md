# @vanderbilt/yes-api

### A simple, no-hassle library for efficiently scraping Your Enrollment Services.

##### Created by Dylan Hanson (jovialis)
---
_NOTE: THIS MODULE IS ESM ONLY IN CONJUNCTION WITH CHANGING NODE.JS COMMUNITY STANDARDS. READ
MORE: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c_

## Usage

### Install

```
npm install @vanderbilt/yes-api
```
OR
```
yarn add @vanderbilt/yes-api
```

### Import

```typescript
import * as yes from "@vanderbilt/yes-api";
```

### List All Available Subjects

This endpoint returns a list of subjects and their abbreviations. For example, `Computer Science` is abbreviated as`CS`.

```typescript
// Subject[]
const subjects = await yes.getSubjects();
```

### List All Available Terms

This endpoint lists all of the Terms available on YES, including their IDs and associated Sessions.

```typescript
// Term[]
const terms = await yes.getTerms();
```

### List All Sections

Returns a list of all of the Sections present on YES in a given Term. For example, `CS 2201` may have 3 Sections, each
of which will be returned as a unique record.

```typescript
// Section[]
const sections = await yes.getAllSections(terms[0]);
```

### Search All Sections

Returns up to 300 Sections fetched from YES using a search query in a given Term.

```typescript
// Section[]
const sections = await yes.searchSections("greece", terms[0]);
```

### Fetch Section Details

Returns expanded details for a Section. This includes the section's current enrollment, notes, attributes, bookstore
URL, and more. <b>NOTE: This can be automatically fetched by passing `true` for the `detailed` param in `getAllSections`
or `searchSections`.</b>

```typescript
// SectionDetails
const details = await yes.getSectionDetails(sections[0]);
```

## Response Streaming

Even though all functions return Promise-wrapped results, you can pass a handler as the _last param_ to all functions in
order to handle results as they are fetched from YES.

```typescript
const sections = await yes.getAllSections(terms[0], false, (section, timeElapsed) => {
    console.log(term);
    console.log(`${timeElapsed}ms elapsed.`);
});
```

**NOTE: The handler can return a promise!**

```typescript
const sections = await yes.getAllSections(terms[0], false, async (section, timeElapsed) => {
    await mongodb.collection('sections').insert(section);
});
```

## Thanks

Special thanks to the VUIT for necessitating this package's existence. Super special thanks to VUIT, which has so far
not filed a cease and desist.
