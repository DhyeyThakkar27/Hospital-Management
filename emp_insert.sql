create or replace procedure emp_insert(eId INT , eName varchar(45) , eSex varchar(45) , eSalary int8 ,eDepartment varchar(45),eExperiance float ,eContact varchar(45) )
is
begin
INSERT INTO `employee` (`e_id`, `e_name`, `e_sex`, `e_salary`, `e_department`, `e_exp`, `e_con`) VALUES (eId , eName , eSex , eSalary , eDepartment , eExperiance , eContact)
end;