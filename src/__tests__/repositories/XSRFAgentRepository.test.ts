import { XSRFAgentRepositoryClass } from '~/repo/XSRFAgentRepository';
import { beforeAll, describe, expect, it } from 'vitest';
import { shouldfail } from '~/utils/testing-utils';



describe('XSRF Agent Repository', () => {
  const agentRepository = new XSRFAgentRepositoryClass({ testmode: true });



  beforeAll(async () => {
    await agentRepository.create({ origin: 'lolkek.com', saveDocument: false });
  });



  /**
   * [+] Should create new agent (beforeAll)
   * [+] Should validate origin
   * [+] Should ensure that origin is unique
   */
  it('should create new agent', async () => {
    // Should validate origin
    shouldfail(async () => { await agentRepository.create({ origin: 'lolkek', saveDocument: false }); });

    // Should validate origin
    shouldfail(async () => { await agentRepository.create({ origin: 'lolkek.com', saveDocument: false, _isOriginExist: true }); });
  });



  /**
   * [+] Should refresh keypairs
   */
  it('should refresh keypairs', async () => {
    const prevPK = agentRepository.document?.public_key;

    const sk = agentRepository.refreshKeys();

    expect(agentRepository.document?.public_key).not.toBe(sk);
    expect(agentRepository.document?.public_key).not.toBe(prevPK);
  });
});