# Sprint-0 Meeting

4/9/2026

5:50 pm - 8:00 pm

Attending: All

## Agenda Item 1:

_Decide on a Meeting Manager (This person is NOT the group leader. The meeting manager’s role is to keep the group on task during the meeting)_

Meeting Manager: Caleb Ernst

## Agenda Item 2:

_Decide on a Meeting Scribe (This person documents the meeting minutes. Group, help the scribe in their role. Keep your own notes. Work slowly enough so that the scribe may document the meeting)_

Meeting Scribe: Christina Blackwell

## Agenda Item 3:

_Get to know each group member. Each group member answer (at least) the following questions:_

### What is your name/nickname and what do you prefer to be called?

- Christina Blackwell: Christina
- Mansur Yassin: Mansur
- Caleb Ernst: Caleb
- Charlene Jarrell: Charlene

### Where did you do Freshman/Sophomore year and/or where did you take 142/143? Did your 142/143 prepare you for this course?

The consensus is that our 142/143 classes taught us fundamental programming skills, but did not cover any of the specific
languages and tools we are using for TCSS 460. Caleb mentioned that one area his 142/143 classes did not cover is version control
practices and tools.

- Christina Blackwell: Olympic College
- Mansur Yassin: Seattle Central College
- Caleb Ernst: Pierce College
- Charlene Jarrell: Green River College

### What are your programming strengths and weaknesses?

_BE HONEST! It’s ok that you are not a good programmer. Let your group know so that the group as a whole can work with you._

- Christina Blackwell:
  - weakness: databases
  - strengths: systematic, cloud computing
- Mansur Yassin:
  - strengths: versatile, reliable, communication
- Caleb Ernst:
  - weakness: networking
  - strengths: databases
- Charlene Jarrell:
  - weakness: databases
  - strengths: networking, TCP/IP protocols

### What other obligations take time away from your ability to work on this project?

_Work, Family/Kids, 20 credits this quarter, etc. BE HONEST Let your group know so that the group as a whole can work with you._

- Everyone: other classes
- Caleb Ernst: IEEE meetings
- Charlene Jarrell: caretaking for grandparents

### What is something you want others to know about yourself?

- Christina Blackwell: likes birds, goes birdwatching
- Mansur Yassin: likes drawing and computer graphics design
- Caleb Ernst: is open for hire
- Charlene Jarrell: can be slower to understand material at first but gains a deep understanding

## Agenda Item 4:

_Decide on a group structure._

We chose not to appoint a dedicated group leader.
We will create branches for each feature we are implementing and won't merge into main until changes are ready to be deployed.
Each week we decide on what tasks we'll each complete during our intial meeting and share progress at subsequent meetings.
We have not assigned definitive roles yet, but we want to assign tasks based on whoever has the least experience in that area where possible.
Our SMEs will review PRs related to their expertise.
We will communicate through the group Discord server when we have pull requests available for review.
We are using the WebStorm IDE and deploying our API with Render: https://tcss460-team-8-api.onrender.com/

_Who are the Subject Matter Experts (SME) for different areas? GUI, OO, Logic, Management, etc._

- Christina Blackwell: version control/GitHub, WebStorm IDE, cloud computing, 00
- Mansur Yassin: databases, front end
- Caleb Ernst: logic, databases, debugging, cross-platform development
- Charlene Jarrell: testing, networking

## Agenda Item 5:

_Discuss your concerns for the group project. Air any bad experiences from group work in the past. Discuss what you want
to get out of this group project. Discuss strategies you think can work for a successful group project._

No one had any terrible group project experiences to share. We all want to gain full stack web development experience.

- Christina Blackwell: wants more experience with databases; follow OO principles when possible, avoid tight coupling and overly long/complex scripts
- Mansur Yassin: don't over rely on AI, make sure we understand what the code is doing
- Caleb Ernst: make sure comments are useful and succinct
- Charlene Jarrell: make sure documentation is consistent; communicate with team members and be punctual to meetings

## Agenda Item 6:

_The group needs to meet synchronously (online is OK) AT LEAST 3 times a Week. What times/days work for everyone?_

- Monday: 3-5 pm
- Wednesday: 12-5 pm
- Friday: 2:30 - 4 pm

## Agenda Item 7:

The rest of the meeting was used to set up WebStorm, work through the Sprint 0 deliverables, and deciding what service to use
to deploy our API.

# Sprint-1 Meeting

4/15/2026

3:50 pm - 5:00 pm

Attending: All

Meeting Manager: Caleb Ernst

Meeting Scribe: Charlene Jarrell

## Agenda Item 1:

_Update ESlint._

Christina followed instructions provided in Sprint 1 to update ESlint and pushed to main.

## Agenda Item 2:

_Accquire TMDB API Key._

Mansur completed this task.

## Agenda Item 3:

_Design our API routes and response shapes._

Minimum requirement:  
-Support search by title  
-Return response card with poster image, title, release year/first air date, and synopsis

Search by Title  
https://api.themoviedb.org/3/search/movie  
id:  
https://api.themoviedb.org/3/search/tv  
id:

Response Card  
https://api.themoviedb.org/3/movie/{movie_id}  
id:  
title:  
poster_path:  
release_date:  
overview:  
https://api.themoviedb.org/3/tv/{series_id}  
id:  
name:  
poster_path:  
first_air_date;  
overview:

Return Popular Movie  
https://api.themoviedb.org/3/movie/popular  
https://developer.themoviedb.org/reference/tv-series-popular-list

## Agenda Item 4:

_Questions to Be Addressed Before or at Next Meeting._

For the group

Q: Should we allow search by keyword (Star Wars) rather than the full title (Star Wars: Episode IV - A New Hope)?  
A: Yes.

Q: Should we cut off the popular movies/shows list based on minimum rating?  
A: Not for now. Default to 20 per request if limit is not specified.

Q: What is meant by render a response "card"?  
A: JSON response with required fields for frontend to use.

Q: For poster image, do we forward the URL to the frontend?  
A: Yes.

Q: Does popular movies/tv shows return the response card? Is it just a filtered JSON response?  
A: Yes.

For the professor

Q: Does everyone need their own TMDB API key? If so, which one is used in Render?  
A: Yes, for development work on local machines. A separate key can even be generated specifically for render.

Q: What is a proper file structure?  
A: Follow the class demos closely. Movies and TV Shows should have separate test and controller files. One validation file, unless unique. Protected directory is for when we use JSON web token and JWT middleware.

Q: Do we need versioning? (v1, v2, etc.)  
A: Routes for endpoints can be on “v1” even though we are not incrementing to v2 in this class. This is good practice and lays the structure for future development.

# Sprint-2 Meeting

4/22/2026

3:50 pm - 5:00 pm

Attending: All

Meeting Manager: Charlene Jarrell

Meeting Scribe: Caleb Ernst

## Agenda Item 1:

Change our meeting schedule to Mondays to get a headstart on the sprint

## Agenda Item 2:

Discussed Checkoff schedule to ensure we can communicate earlier

## Agenda Item 3:

Review Table attributes/ Primary Key

Primary key = Auto Increment Identifier

Entity Reviews
Primary Key - ReviewID (Serial)
Attributes:
Review Enum()
Body (Text)

Title (VarChar)
Date_Created (TIMESTAMPZ)
Date_Updated (TIMESTAMPZ)

Foreign Keys
UserId
MovieId

Entity Users:
Primary Key - ID (BigSerial)
Attributes:
Username (Varchar)
email (Varchar) ???????
Password (hash)????
created_at

Entity Ratings:
Primary Key- ReviewID
Foreign Key- User ID
Attributes:
Media type (enum)
MediaID (int)
Score (Numeric)

Entity: (
order_id INT,
product_id INT,
quantity INT,
PRIMARY KEY (order_id, product_id)
);

## Agenda Item 4:

Indexes for fast retrival

Essential Indexes for Ratings Tables
Primary Key (id or (user_id, item_id)): Ensures uniqueness of a user's rating for a specific item.
Item & User Foreign Key (item_id, user_id): Individual indexes on these columns are necessary for filtering, but compound indexes are usually better.
Compound Index (item_id, rating): Crucial for high-performance retrieval of average ratings, top-ra

Possibly ask if we dont need?
easy to do tho so Caleb will handle if we do

## Agenda Item 5:

Implement and put Delete/Update endpoints
aka make handler and api doc

upsert dem
return 403 if not authorized to delete review

## Agenda Item 6:

Update prisma schema file

User Story Delegation:
Setup and Prisma: Caleb
PSQL DB creation -Caleb

As a user, I want to submit a rating for a movie or show so that my opinion contributes to the community's picture of the content

As a user, I want to update and delete my own ratings and reviews so that I can correct mistakes or change my mind
-Christina ^

As an admin, I want to delete inappropriate reviews so that the platform stays usable.

As a visitor, I want to see ratings and reviews for a movie or show so that I can decide whether to watch it.

-Mansur ^

As a user, I want to write a review for a movie or show so that I can share more than just a score.

As a frontend developer, I want OpenAPI documentation and automated tests for every new endpoint so that I can integrate without reading source code and trust the API behaves as documented.

-Charlene

# Sprint-3 Meeting

4/27/2026

5:00 pm - 6:30 pm

Attending: All

Meeting Manager: Charlene Jarrell

Meeting Scribe: Mansur Yassin

## Agenda Item 1:

_Auth² check-off and project setup recap_

1. Walked through the Auth² check-off as a team to make sure everyone understands the JWKS verification flow, the audience claim (`group-8-api`), and the PascalCase role claim.
2. Completed project setup in the sprint-3 branch and confirmed it is safe to merge into main — the setup branch only swaps dev-login + JWT_SECRET for the JWKS-based middleware, adds `subjectId`, and wires `resolveLocalUser`. Existing routes still pass tests behind the new middleware.
3. Decided on role-gating policy: use **exact-match** (`requireRole('Admin')`) for narrow gates and the **hierarchy** form (`requireRoleAtLeast('Admin')`) for "any privileged user" gates. Default to exact-match unless a peer review says otherwise.

## Agenda Item 2:

_Sprint-3 story assignments_

Charlene will go through stories 1 and 3, Caleb will take stories 2 and 6, Christina will take story 5, and Mansur will take stories 4 and 7.

1. **Charlene** — As a team, we want our API to verify real tokens issued by the shared Auth² service so that every authenticated user across the course's APIs is one user, identified the same way everywhere.

2. **Caleb** — As a user, I want my actions to be tied to my Auth² account so that my ratings and reviews follow me across deployments and partner apps. _(Includes the `subjectId` column and the `Issue` model migration so Sprint 4 inherits a stable schema.)_

3. **Charlene** — As a teammate, I want the test suite to keep working after we replace dev-login with real auth so that we can verify our routes without a real identity provider in the loop.

4. **Mansur** — As a visitor, I want to file a bug report against your API so that the team building on top of it can tell you when something is broken without finding you on Slack.

5. **Christina** — As a visitor, I want to see a movie or show's details alongside what your community thinks of it so that I can decide whether it's worth watching.

6. **Caleb** — As a frontend developer, I want to call your API at a public HTTPS URL backed by a real database so that I can integrate against it from anywhere, not just from a teammate's laptop.

7. **Mansur** — As a frontend developer, I want clear documentation, predictable errors, and a way to verify your API is alive so that I can build against it without reading your source.

## Agenda Item 3:

_Questions and coordination_

Q: Since we know that movie and tv show IDs do not overlap in TMDB or our database, should we use a route param instead of query param to get ratings and reviews for a movie/show?
A: Turns out, TMDB movies and tv shows may have overlapping IDs, so we do need to specify media type in the query params.

Q: Do we need `requireAuth` middleware?
A: Yes, copied from class demo and adapted to verify against the Auth² JWKS rather than HS256 + JWT_SECRET.

Q: Is it safe to merge sprint-3-setup into main?
A: Yes — it only swaps the auth internals; existing tests still pass. Merge so everyone can branch off main for their assigned story.

Q: How should we coordinate story 4 (`POST /v1/issues`), which depends on the Issue model from story 2?
A: Caleb will publish the Issue schema field shape in Discord (title, description, optional reproSteps, optional reporterEmail, status enum) ahead of time so Mansur's controller and OpenAPI path can be written against the agreed contract and dropped in the moment story 2 lands.

Q: How should auth-protected tests run without a real identity provider?
A: Story 3's test stub will read an `X-Test-User` JSON header and inject `request.user` in `NODE_ENV=test`. Everyone writing auth-protected tests should use that pattern instead of minting real tokens.

Q: Where does the safe error handler need to live for story 7?
A: It must be the last middleware mounted in `app.ts` so it catches anything that escapes a controller and returns a generic JSON envelope without leaking stack traces.

## Agenda Item 4:

_Action items and next sync_

- Everyone branches off `main` for their assigned story today.
- Each PR is scoped to exactly one story; reviewers reject PRs that bundle multiple stories so review and blame stay readable.
- Caleb to publish the Issue schema field shape in Discord by end of day so dependent work can start.
- Christina to coordinate with Mansur on the enriched detail route's response shape (story 5 is the consumer of any review/rating aggregation Mansur's tests rely on).
- Charlene to confirm with the professor that the audience name `group-8-api` is the one registered with Auth² for our group, and update `.env.example` + Render env vars accordingly.
- Story 6 owner (Caleb) to wire the CORS allowlist env var and run `prisma migrate deploy` against the Render Postgres once story 2's migration lands.
- Next sync: Friday 5/1 at 2:30 pm (regular Friday slot) for mid-sprint progress check.

# Sprint-4 Meeting

5/8/2026

5:00 pm - 6:30 pm

Attending: All

Meeting Manager: Mansur Yassin

Meeting Scribe: Caleb Ernst

## Agenda Item 1:

We discussed how we are going to deal with the ransomware attack and moving forward with the other aspects of the class like what to do about the quiz.

## Agenda Item 2:

_Sprint-4 story assignments_

**User Story 1 — Charlene**

As an admin, I want to see every bug report filed against our API so that I can spot patterns, prioritize fixes, and answer "did anyone already report this?" without going through Slack.

- Not yet assigned to a specific implementer.
- Should be admin-only.
- Most important bugs should surface at the top.
- Sort also by when the ticket was created.
- Completed tickets should not disappear from the UI but remain in the system.

**User Story 2 — Charlene**

Status for claimed, completed, or not used.

**User Story 3 — Caleb**

As a user, I want to see every movie and show I've rated alongside its TMDB metadata so that I can browse my own taste history.

- Default to 20 items per page, matching TMDB pagination defaults.
- Requires a new combined route that pings the TMDB API and our database and returns a single joined JSON response.

**User Story 4 — Caleb**

As a visitor, I want to see what your community is rating highest right now so that I can find something worth watching without knowing what to search for.

- Results will be cached to reduce TMDB API costs and improve response times under higher load.

**User Story 5 — Mansur**

As a user, I want to see my own reviews and ratings, and as a visitor I want every review and rating to show who wrote it, so that the review feed reads like a community and not an anonymous dump.

- Straightforward story; can be implemented with AI assistance.

**User Story 6 — Mansur**

As a frontend developer (your downstream partner), I want a complete, accurate OpenAPI spec so that I can build my consumer app against your contract without reading your source.

- Relatively simple update.

**User Story 7 — Christina**

As a frontend developer (your downstream partner), I want a partner-facing README and a CORS configuration that lets my app call your API so that I can integrate against your deployed API on day one.

- Planning to deploy the frontend on Vercel.
