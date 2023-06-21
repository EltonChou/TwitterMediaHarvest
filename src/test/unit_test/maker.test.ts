/**
 * @jest-environment jsdom
 */
import { DownloadRecordIdHelper } from '../../backend/downloads/helpers'

describe('Test DownloadRecordUtil', () => {
  it('can valid DownloadRecord id', () => {
    expect(DownloadRecordIdHelper.validId('dl_384')).toBeTruthy()
    expect(DownloadRecordIdHelper.validId('384')).toBeFalsy()
  })

  it('can extract DownloadItemId from DownloadRecord id', () => {
    expect(DownloadRecordIdHelper.toDownloadItemId('dl_123')).toBe(123)
  })
})
