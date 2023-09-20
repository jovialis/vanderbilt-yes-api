# @vanderbilt/yes-api

### A simple, no-hassle library for efficiently querying Your Enrollment Services.

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
<br/>
*NOTE: THIS OPERATION CAN TAKE A LONG TIME! EXPECT UPWARDS OF 40 MINUTES FOR SPRING/FALL SEMESTERS.*

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

### Check Section Existence

Returns whether or not a Section exists within a given term. Note that this function accepts IDs, rather than objects.

```typescript
// Boolean
const exists = await yes.sectionExists(sections[0].id, sections[0].term.id);
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

## FAQ

#### Does this API fetch ALL Courses?
* For the most part, yes! There are a few exceptions. Due to our scraping algorithm and YES' limitations, we are unable to fetch courses with the course numbers
  `3850`, `3851`, `3852`, (Independent reading/study)
  `7999`, (Master's Thesis Research)
  `8999`, (Non candidate research)
  `9999` (Ph.D dissertation research).

#### How should I use this package?
* This API's speed is unfortunately limited by the speed of YES itself since it fetches data from the source with every request. Consider using this API in a batch process, uploading discovered data to a database or lake for fast, efficient querying and downstream processing.