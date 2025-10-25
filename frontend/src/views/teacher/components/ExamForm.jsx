import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import CodingQuestionForm from './CodingQuestionForm';

const CreateExam = ({ formik, title, subtitle, subtext }) => {
  const { values, errors, touched, handleBlur, handleChange, handleSubmit, isSubmitting } = formik;

  return (
    <Box>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Box component="form" noValidate onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <CustomTextField
            id="examName"
            name="examName"
            label="Exam Name"
            variant="outlined"
            fullWidth
            value={values.examName}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.examName && Boolean(errors.examName)}
            helperText={touched.examName && errors.examName}
          />

          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Exam Type: MCQ + Coding
          </Typography>

          <CustomTextField
            id="totalQuestions"
            name="totalQuestions"
            label="Total Number of Questions"
            variant="outlined"
            fullWidth
            value={values.totalQuestions}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.totalQuestions && Boolean(errors.totalQuestions)}
            helperText={touched.totalQuestions && errors.totalQuestions}
            type="number"
          />

          <CustomTextField
            id="duration"
            name="duration"
            label="Exam Duration (minutes)"
            variant="outlined"
            fullWidth
            value={values.duration}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.duration && Boolean(errors.duration)}
            helperText={touched.duration && errors.duration}
            type="number"
          />

          <TextField
            id="liveDate"
            name="liveDate"
            label="Live Date and Time"
            type="datetime-local"
            variant="outlined"
            fullWidth
            value={values.liveDate}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.liveDate && Boolean(errors.liveDate)}
            helperText={touched.liveDate && errors.liveDate}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            id="deadDate"
            name="deadDate"
            label="Dead Date and Time"
            type="datetime-local"
            variant="outlined"
            fullWidth
            value={values.deadDate}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.deadDate && Boolean(errors.deadDate)}
            helperText={touched.deadDate && errors.deadDate}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Box>
            <Button
              color="primary"
              variant="contained"
              size="large"
              fullWidth
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Create Exam'}
            </Button>
          </Box>
        </Stack>
      </Box>

      {subtitle}
    </Box>
  );
};

export default CreateExam;