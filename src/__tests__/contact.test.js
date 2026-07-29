const { groupByPerson, displayName } = require('../commands/contact');

describe('displayName', () => {
  it('prefers full name', () => {
    expect(displayName({ fullName: 'Alice', username: '@a' })).toBe('Alice');
  });

  it('falls back through username, phone, then email', () => {
    expect(displayName({ username: '@a' })).toBe('@a');
    expect(displayName({ phoneNumber: '+15551234567' })).toBe('+15551234567');
    expect(displayName({ email: 'a@example.com' })).toBe('a@example.com');
  });

  it('handles a contact with no identifiers', () => {
    expect(displayName({})).toBe('Unknown Contact');
  });
});

describe('groupByPerson', () => {
  const aliceChat = {
    id: '!c1',
    title: 'Alice Smith',
    network: 'WhatsApp',
    accountID: 'wa1',
    type: 'single',
    lastActivity: '2026-07-28T09:00:00Z'
  };

  it('groups one person reachable on several networks into a single entry', () => {
    const groups = groupByPerson([aliceChat], [
      { id: 'tg:alice', fullName: 'Alice Smith', network: 'Telegram', accountID: 'tg1' }
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe('Alice Smith');
    expect(groups[0].destinations.map(d => d.network)).toEqual(['WhatsApp', 'Telegram']);
  });

  it('drops a contact whose network already has an existing 1:1 chat', () => {
    const groups = groupByPerson([aliceChat], [
      { id: 'wa:alice', fullName: 'Alice Smith', network: 'WhatsApp', accountID: 'wa1' }
    ]);

    expect(groups[0].destinations).toHaveLength(1);
    expect(groups[0].destinations[0].kind).toBe('chat');
  });

  it('still offers a new chat on a network only reachable via contacts', () => {
    const groups = groupByPerson([], [
      { id: 'sig:bob', fullName: 'Bob', network: 'Signal', accountID: 'sig1' }
    ]);

    expect(groups[0].destinations[0]).toMatchObject({ kind: 'contact', network: 'Signal' });
  });

  it('carries identifier hints so the chat can be resolved per network', () => {
    const groups = groupByPerson([], [
      { id: 'tg:alice', fullName: 'Alice', username: '@alice', network: 'Telegram', accountID: 'tg1' }
    ]);

    expect(groups[0].destinations[0].user).toMatchObject({
      id: 'tg:alice',
      username: '@alice',
      fullName: 'Alice'
    });
  });

  it('marks contacts that cannot be messaged', () => {
    const groups = groupByPerson([], [
      { id: 'x:1', fullName: 'Blocked', network: 'Signal', accountID: 's1', cannotMessage: true }
    ]);

    expect(groups[0].destinations[0].cannotMessage).toBe(true);
  });

  it('ranks people with an existing chat above contact-only matches', () => {
    const groups = groupByPerson([aliceChat], [
      { id: 'tg:zoe', fullName: 'Zoe', network: 'Telegram', accountID: 'tg1' }
    ]);

    expect(groups.map(g => g.name)).toEqual(['Alice Smith', 'Zoe']);
  });

  it('matches the same person case-insensitively', () => {
    const groups = groupByPerson([aliceChat], [
      { id: 'tg:alice', fullName: 'alice smith', network: 'Telegram', accountID: 'tg1' }
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].destinations).toHaveLength(2);
  });

  it('returns nothing when there are no matches', () => {
    expect(groupByPerson([], [])).toEqual([]);
  });
});

describe('result limiting', () => {
  test('caps contacts per account so a short query cannot overflow Alfred', async () => {
    // GET /v1/accounts/{id}/contacts takes no limit param, so a query like "a"
    // can return thousands per network; unbounded output truncates in the pipe.
    const BeeperClient = require('../api/client');
    const client = new BeeperClient('token');

    client.getAccounts = async () => [
      { accountID: 'acc1', network: 'whatsapp' },
      { accountID: 'acc2', network: 'telegram' }
    ];
    client.searchContacts = async () =>
      Array.from({ length: 500 }, (_, i) => ({ id: `u${i}`, fullName: `Person ${i}` }));

    const contacts = await client.searchContactsGlobal('a');

    // 20 per account across 2 accounts
    expect(contacts).toHaveLength(40);
  });

  test('honours an explicit per-account limit', async () => {
    const BeeperClient = require('../api/client');
    const client = new BeeperClient('token');

    client.getAccounts = async () => [{ accountID: 'acc1', network: 'whatsapp' }];
    client.searchContacts = async () =>
      Array.from({ length: 100 }, (_, i) => ({ id: `u${i}`, fullName: `P${i}` }));

    expect(await client.searchContactsGlobal('a', 5)).toHaveLength(5);
  });

  test('drops self contacts before applying the cap', async () => {
    const BeeperClient = require('../api/client');
    const client = new BeeperClient('token');

    client.getAccounts = async () => [{ accountID: 'acc1', network: 'whatsapp' }];
    client.searchContacts = async () => [
      { id: 'me', fullName: 'Me', isSelf: true },
      { id: 'u1', fullName: 'Alice' }
    ];

    const contacts = await client.searchContactsGlobal('a', 2);

    expect(contacts.map(c => c.id)).toEqual(['u1']);
  });
});
