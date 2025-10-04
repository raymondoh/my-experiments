import { getProductById, listProducts } from "@/lib/services/products";

jest.mock("@/lib/firebase/server", () => {
  return {
    getAdminFirestore: jest.fn(),
    FieldValue: { serverTimestamp: jest.fn() },
    FieldPath: { documentId: jest.fn(() => ({ __type: "document-id" })) },
  };
});

const { getAdminFirestore, FieldPath } = jest.requireMock("@/lib/firebase/server") as {
  getAdminFirestore: jest.MockedFunction<() => { collection: jest.Mock }>;
  FieldPath: { documentId: jest.Mock };
};

describe("products service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists products with ISO dates and pagination cursor", async () => {
    const createdAtFirst = new Date("2024-01-01T00:00:00.000Z");
    const createdAtSecond = new Date("2024-01-02T00:00:00.000Z");
    const documents = [
      createDocumentSnapshot("helmet-1", {
        name: "Helmet 1",
        slug: "helmet-1",
        price: 199.99,
        category: "helmets",
        images: ["helmet-1.jpg"],
        createdAt: createdAtFirst,
        updatedAt: createdAtFirst,
      }),
      createDocumentSnapshot("helmet-2", {
        name: "Helmet 2",
        slug: "helmet-2",
        price: 249.5,
        category: "helmets",
        images: ["helmet-2.jpg"],
        createdAt: createdAtSecond,
        updatedAt: createdAtSecond,
      }),
      createDocumentSnapshot("helmet-3", {
        name: "Helmet 3",
        slug: "helmet-3",
        price: 149.5,
        category: "helmets",
        images: ["helmet-3.jpg"],
        createdAt: createdAtSecond,
        updatedAt: createdAtSecond,
      }),
    ];

    const collectionMock = jest.fn(() => createQueryChain(documents));
    getAdminFirestore.mockReturnValue({ collection: collectionMock });

    const result = await listProducts({ category: "helmets", limit: 2 });

    expect(collectionMock).toHaveBeenCalledWith("products");
    expect(result.items).toHaveLength(2);
    result.items.forEach(product => {
      expect(product.category).toBe("helmets");
      expect(product.createdAtISO).toMatch(/T/);
    });

    const expectedCursor = Buffer.from(JSON.stringify([createdAtSecond, "helmet-2"])).toString("base64url");
    expect(result.nextCursor).toBe(expectedCursor);

    const query = collectionMock.mock.results[0]?.value as MockQuery;
    expect(query.where).toHaveBeenCalledWith("category", "==", "helmets");
    expect(FieldPath.documentId).toHaveBeenCalled();
  });

  it("returns a single product mapped from Firestore", async () => {
    const createdAt = new Date("2024-02-02T00:00:00.000Z");
    const doc = createDocumentSnapshot("helmet-10", {
      name: "Helmet 10",
      slug: "helmet-10",
      price: 499,
      category: "helmets",
      images: ["helmet-10.jpg"],
      createdAt,
      updatedAt: createdAt,
    });

    const getMock = jest.fn().mockResolvedValue(doc);
    const docMock = jest.fn(() => ({ get: getMock }));
    const collectionMock = jest.fn(() => ({ doc: docMock }));

    getAdminFirestore.mockReturnValue({ collection: collectionMock });

    const product = await getProductById("helmet-10");

    expect(product).not.toBeNull();
    expect(product?.id).toBe("helmet-10");
    expect(product?.createdAtISO).toBe(createdAt.toISOString());
    expect(collectionMock).toHaveBeenCalledWith("products");
    expect(docMock).toHaveBeenCalledWith("helmet-10");
  });
});

type FirestoreData = Record<string, unknown>;

type QueryDocSnapshot = {
  id: string;
  exists: boolean;
  data: () => FirestoreData;
  get: (field: string | { __type: string }) => unknown;
};

type MockQuery = {
  where: jest.Mock;
  orderBy: jest.Mock;
  startAfter: jest.Mock;
  limit: jest.MockedFunction<(limit: number) => { get: () => Promise<{ docs: QueryDocSnapshot[] }> }>;
};

function createDocumentSnapshot(id: string, data: FirestoreData): QueryDocSnapshot {
  return {
    id,
    exists: true,
    data: () => data,
    get: field => {
      if (typeof field === "string") {
        return data[field];
      }

      return data[field.__type as string];
    },
  };
}

function createQueryChain(documents: QueryDocSnapshot[]): MockQuery {
  const query: Partial<MockQuery> & {
    limit: jest.MockedFunction<(limit: number) => { get: () => Promise<{ docs: QueryDocSnapshot[] }> }>;
  } = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    startAfter: jest.fn().mockReturnThis(),
    limit: jest.fn(limitValue => ({
      get: () => Promise.resolve({ docs: documents.slice(0, limitValue) }),
    })),
  };

  return query as MockQuery;
}
