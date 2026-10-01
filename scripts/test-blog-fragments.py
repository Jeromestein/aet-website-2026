"""Regression coverage for date-led fragments and genuine invalid nesting."""
import unittest
from blog_html import parse_blog_fragment


class BlogFragments(unittest.TestCase):
    def test_date_before_figure_does_not_invent_paragraph(self):
        soup = parse_blog_fragment('02/09/2024<br><figure><img src="/photo.jpg"></figure>')
        self.assertFalse(soup.select('p figure'))
        self.assertIn('02/09/2024', soup.get_text())

    def test_date_before_disclosure_does_not_invent_paragraph(self):
        soup = parse_blog_fragment('03/06/2024<br><details><summary>Archive</summary><figure>Image</figure></details>')
        self.assertFalse(soup.select('p details, p figure'))

    def test_actual_invalid_containers_still_fail(self):
        for body, selector in [
            ('<p>Date<figure>Image</figure></p>', 'p figure'),
            ('<p>Date<details><summary>Archive</summary></details></p>', 'p details'),
            ('<a href="/contact"><details><summary>Archive</summary></details></a>', 'a details'),
        ]:
            with self.subTest(body=body):
                self.assertTrue(parse_blog_fragment(body).select(selector))


if __name__ == '__main__':
    unittest.main()
