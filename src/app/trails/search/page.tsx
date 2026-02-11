import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

function buildQuery(searchParams?: SearchParams) {
  const params = new URLSearchParams();

  if (!searchParams) {
    return '';
  }

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry) {
          params.append(key, entry);
        }
      });
      return;
    }

    if (value) {
      params.set(key, value);
    }
  });

  return params.toString();
}

export default function SearchTrailsRedirect({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const query = buildQuery(searchParams);
  redirect(query ? `/map?${query}` : '/map');
}
