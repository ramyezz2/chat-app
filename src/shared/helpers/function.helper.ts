import { Types } from 'mongoose';
export const transformStringComaSeparatedToArray = (
  itemsIds,
  trimItem?,
  lowerCaseItem?,
) => {
  let itemsIdsArray = [];
  if (itemsIds) {
    if (typeof itemsIds == 'string') {
      const itemsIdsString: string = itemsIds.trim();
      itemsIdsArray = itemsIdsString.split(',')?.map((item) => {
        if (trimItem) {
          item = item.trim();
        }
        if (lowerCaseItem) {
          item = item.toLowerCase();
        }
        return item;
      });
    } else {
      itemsIdsArray = itemsIds?.map((item) => {
        if (trimItem) {
          item = item.trim();
        }
        if (lowerCaseItem) {
          item = item.toLowerCase();
        }
        return item;
      });
    }
  }
  return itemsIdsArray || [];
};

export const validateEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

export const checkArrayItemIsObjectId = (ids: string[]): boolean => {
  const arrayValidation = ids.find((id) => !Types.ObjectId.isValid(id));
  return arrayValidation ? true : false;
};
