/** Parse WEK, MON MM, YYYY */
export function parseIMDBDate(dateString: string): number {
  const months = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const dateParts = dateString.split(' ');

  const day = parseInt(dateParts[2]);
  const month = months[dateParts[1]];
  const year = parseInt(dateParts[3]);


  return +new Date(year, month, day);
}

export default parseIMDBDate;