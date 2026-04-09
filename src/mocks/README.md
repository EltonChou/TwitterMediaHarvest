# src/mocks

Test doubles used in unit tests. Each subdirectory mirrors the structure of the source it mocks.

## Directory structure

```
mocks/
├── applicationUseCases/   # Application use case doubles
├── caches/                # Cache interface doubles
├── repositories/          # Domain repository doubles
├── useCases/              # Domain use case doubles
├── eventPublisher.ts      # MockEventPublisher
└── storageProxy.ts        # InMemoryStorageProxy
```

## Usage

Import the mock you need and wire it into the subject under test. Override specific methods with `jest.spyOn` when a test needs a particular return value.

```ts
import { MockDownloadRecordRepo } from '#mocks/repositories/downloadRecord'

const repo = new MockDownloadRecordRepo()
jest.spyOn(repo, 'getById').mockResolvedValue(toSuccessResult(record))
```
