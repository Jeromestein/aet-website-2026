"""Parse imported article fragments in their real container context."""
from bs4 import BeautifulSoup


def parse_blog_fragment(html):
    # libxml invents a paragraph around leading text in a bare document. The
    # real page inserts this fragment into an article; keep that block context.
    return BeautifulSoup('<div>' + html + '</div>', 'lxml')
