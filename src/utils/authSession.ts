export const getUserPrimaryId = (user: any): number | null => {
  const rawId =
    user?.id ??
    user?.intBuyerId ??
    user?.intFarmerId ??
    user?.intUserId ??
    user?.userId ??
    user?.buyerId ??
    user?.farmerId;

  const parsedId = Number(rawId);
  return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null;
};

export const normalizeStoredUser = (user: any) => {
  if (!user || typeof user !== "object") {
    return null;
  }

  const normalizedId = getUserPrimaryId(user);

  return {
    ...user,
    id: normalizedId ?? user.id ?? null,
  };
};

export const parseStoredUser = (userStr: string | null) => {
  if (!userStr) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(userStr);
    return normalizeStoredUser(parsedUser);
  } catch (error) {
    console.log("Error parsing stored user session", error);
    return null;
  }
};
