from services.java_utils import (
    find_java_main_class,
    find_java_primary_class,
    strip_java_comments_and_strings,
)


def test_strip_java_comments_and_strings():
    code = """
    // Single line comment
    /* Multi
       line comment */
    String s = "Hello \\"world\\"";
    """
    stripped = strip_java_comments_and_strings(code)
    assert "// Single line comment" not in stripped
    assert "Multi" not in stripped
    assert '"Hello \\"world\\""' not in stripped


def test_find_java_main_class():
    code = """
    public class Solution {
        public static void main(String[] args) {
            System.out.println("Hello");
        }
    }
    """
    assert find_java_main_class(code) == "Solution"


def test_find_java_main_class_none():
    code = """
    public class Solution {
        public int add(int a, int b) {
            return a + b;
        }
    }
    """
    assert find_java_main_class(code) is None


def test_find_java_primary_class():
    code = """
    class Helper {}
    public class Primary {}
    """
    assert find_java_primary_class(code) == "Primary"


def test_find_java_primary_class_default():
    code = "// Only comments"
    assert find_java_primary_class(code) == "Main"
