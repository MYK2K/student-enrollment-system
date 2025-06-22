-- This trigger ensures that a student can only be enrolled in a course
-- that belongs to the same college as the student.

CREATE TRIGGER `check_student_course_college`
BEFORE INSERT ON `enrollments`
FOR EACH ROW
BEGIN
    DECLARE student_college_id INT;
    DECLARE course_college_id INT;

    -- Get the college ID for the student being enrolled
    SELECT `college_id` INTO student_college_id
    FROM `students`
    WHERE `id` = NEW.student_id;

    -- Get the college ID for the course being enrolled in
    SELECT `college_id` INTO course_college_id
    FROM `courses`
    WHERE `id` = NEW.course_id;

    -- Compare the two college IDs and raise an error if they do not match
    IF student_college_id != course_college_id THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Constraint violation: Student and Course must belong to the same college.';
    END IF;
END;
