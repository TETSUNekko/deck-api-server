// src/components/DeckBuilder/SearchArea.jsx
import React from "react";
import SearchBar from "../SearchBar";

function SearchArea({
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterColor,
  setFilterColor,
  filterGrade,
  setFilterGrade,
  filterSeries,
  setFilterSeries,
  supportSubtype,
  setSupportSubtype,
  shareCode,
  setShareCode,
  filterVersion,
  setFilterVersion,
  selectedTag,
  setSelectedTag,
  allTags,
  loading,
  onExportImage,
  exporting,
  onExportCode,
  onImportCode,
  onClearDeck,
}) {
  return (
    <SearchBar
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      filterType={filterType}
      setFilterType={setFilterType}
      filterColor={filterColor}
      setFilterColor={setFilterColor}
      filterGrade={filterGrade}
      setFilterGrade={setFilterGrade}
      filterSeries={filterSeries}
      setFilterSeries={setFilterSeries}
      supportSubtype={supportSubtype}
      setSupportSubtype={setSupportSubtype}
      shareCode={shareCode}
      setShareCode={setShareCode}
      filterVersion={filterVersion}
      setFilterVersion={setFilterVersion}
      selectedTag={selectedTag}
      setSelectedTag={setSelectedTag}
      allTags={allTags}
      loading={loading}
      onExportImage={onExportImage}
      exporting={exporting}
      onExportCode={onExportCode}
      onImportCode={onImportCode}
      onClearDeck={onClearDeck}
    />
  );
}

export default SearchArea;
