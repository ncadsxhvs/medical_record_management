# Graph Report - trackmyrvu  (2026-04-28)

## Corpus Check
- 80 files · ~74,759 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1507 nodes · 3650 edges · 20 communities detected
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 254 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `Nt()` - 90 edges
2. `pv` - 62 edges
3. `P1()` - 34 edges
4. `ZE` - 34 edges
5. `cA` - 34 edges
6. `rE()` - 33 edges
7. `ls()` - 32 edges
8. `hA` - 31 edges
9. `c2` - 30 edges
10. `Ih()` - 27 edges

## Surprising Connections (you probably didn't know these)
- `ot()` --calls--> `s()`  [INFERRED]
  playwright-report/trace/sw.bundle.js → playwright-report/trace/assets/defaultSettingsView-BEpdCv1S.js
- `X` --calls--> `Nt()`  [INFERRED]
  playwright-report/trace/uiMode.BWTwXl41.js → playwright-report/trace/assets/codeMirrorModule-Bucv2d7q.js
- `X` --calls--> `Y1()`  [INFERRED]
  playwright-report/trace/uiMode.BWTwXl41.js → playwright-report/trace/assets/defaultSettingsView-BEpdCv1S.js
- `X` --calls--> `Db()`  [INFERRED]
  playwright-report/trace/uiMode.BWTwXl41.js → playwright-report/trace/assets/defaultSettingsView-BEpdCv1S.js
- `de()` --calls--> `wT()`  [INFERRED]
  playwright-report/trace/uiMode.BWTwXl41.js → playwright-report/trace/assets/defaultSettingsView-BEpdCv1S.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.01
Nodes (136): gr(), h0(), i2(), m_(), s0(), _a, ao, as() (+128 more)

### Community 1 - "Community 1"
Cohesion: 0.02
Nodes (166): __(), a_(), a0(), Ab(), Ad, aE(), aN(), Ao() (+158 more)

### Community 2 - "Community 2"
Cohesion: 0.03
Nodes (19): cA, dh(), dS(), Fa(), hA, Ih(), ja(), Kh() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.02
Nodes (85): formatPeriod(), ac(), Ai(), bA(), BE(), bN(), br, Cd (+77 more)

### Community 4 - "Community 4"
Cohesion: 0.03
Nodes (26): aT, r2, tE(), W1(), Xa(), getAuthenticatedUser(), getUserId(), verifyMobileToken() (+18 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (25): $0(), Co(), cx(), dc(), Dy(), Fh(), g0(), gT() (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (57): _a(), Gu(), Ha(), ju(), Ku(), Nt(), Qu(), Uu() (+49 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (12): getDefaultSettings(), loadSettings(), $1(), ar(), $b, $h, kd, Lo() (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.07
Nodes (5): c2, e_(), lr, o2, handleSave()

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (9): bx, cc(), e0(), hx(), Jo(), Ot, uc(), Ux (+1 more)

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (6): Av(), Ev(), ls(), Pn(), validateItems(), la

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (23): handleAddProcedures(), handleAddFromFavorites(), handleAddGroup(), handleAddProcedures(), handleClearAll(), handleSaveVisit(), fetchGroups(), handleAddEditProcedure() (+15 more)

### Community 12 - "Community 12"
Cohesion: 0.12
Nodes (6): queryBreakdown(), querySummary(), oE, alterStatusCodeColumn(), runMigration(), seedRVUData()

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (13): al(), bc(), Hh, Ka, mr(), Pb, Rh(), sc() (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.39
Nodes (1): tc

### Community 15 - "Community 15"
Cohesion: 0.21
Nodes (8): CacheWarmer(), hydrateItems(), validateItems(), getRVUCodeByHCPCS(), getRVUCodes(), loadRVUCodes(), refreshCache(), searchRVUCodes()

### Community 16 - "Community 16"
Cohesion: 0.4
Nodes (2): fetchFavorites(), handleAddFavorite()

### Community 17 - "Community 17"
Cohesion: 0.4
Nodes (1): zb

### Community 18 - "Community 18"
Cohesion: 0.4
Nodes (1): qb

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (2): getAllowedAudiences(), POST()

## Knowledge Gaps
- **Thin community `Community 14`** (16 nodes): `tc`, `._applyAttribute()`, `._assert()`, `.constructor()`, `._eof()`, `._isWhitespace()`, `._next()`, `.parse()`, `._peek()`, `._readAttributes()`, `._readIdentifier()`, `._readRegex()`, `._readString()`, `._readStringOrRegex()`, `._skipWhitespace()`, `._throwError()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (6 nodes): `fetchFavorites()`, `handleAddFavorite()`, `handleDragEnd()`, `handleRemove()`, `handleSelect()`, `FavoritesPicker.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (5 nodes): `zb`, `.constructor()`, `.toJSON()`, `.toSource()`, `.toString()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (5 nodes): `qb`, `.constructor()`, `.toJSON()`, `.toSource()`, `.toString()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (3 nodes): `getAllowedAudiences()`, `POST()`, `route.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Nt()` connect `Community 6` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 13`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Why does `X` connect `Community 4` to `Community 1`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `pv` connect `Community 5` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 78 inferred relationships involving `Nt()` (e.g. with `DE()` and `q()`) actually correct?**
  _`Nt()` has 78 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `P1()` (e.g. with `A()` and `Zu()`) actually correct?**
  _`P1()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `ZE` (e.g. with `Nt()` and `Uu()`) actually correct?**
  _`ZE` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.01 - nodes in this community are weakly interconnected._