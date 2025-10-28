use super::db::Database;
use super::models::*;
use crate::{BackendError, BackendResult};
use rusqlite::OptionalExtension;
use std::collections::HashMap;

pub fn list_resource_ids_by_tags_query(
    tag_filters: &Vec<ResourceTagFilter>,
    param_start_index: usize,
) -> (String, Vec<String>) {
    let mut query = String::from("");
    let mut i = 0;
    let n = tag_filters.len();
    let mut params: Vec<String> = Vec::new();
    for filter in tag_filters {
        let (where_clause, tag_value) = filter
            .get_sql_filter_with_value((i + 1 + param_start_index, i + 2 + param_start_index));

        query = format!(
            "{}SELECT resource_id FROM resource_tags WHERE ({})",
            query, where_clause,
        );
        if i < 2 * (n - 1) {
            query = format!("{} INTERSECT ", query);
        }
        i += 2;
        params.push(filter.tag_name.clone());
        params.push(tag_value);
    }
    (query, params)
}

impl Database {
    pub fn list_resource_annotations(
        &self,
        resource_ids: &[&str],
    ) -> BackendResult<HashMap<String, Vec<Resource>>> {
        if resource_ids.is_empty() {
            return Ok(HashMap::new());
        }

        let placeholders = vec!["?"; resource_ids.len()].join(", ");
        let query = format!("
            SELECT r.id, r.resource_path, r.resource_type, r.created_at, r.updated_at, r.deleted, rt.tag_value
            FROM resources r
            JOIN resource_tags rt ON r.id = rt.resource_id
            WHERE r.deleted = 0 AND r.resource_type = 'application/vnd.space.annotation' AND rt.tag_name = 'annotates' AND rt.tag_value IN ({})",
            placeholders
        );

        let mut stmt = self.conn.prepare(&query)?;
        let rows = stmt.query_map(rusqlite::params_from_iter(resource_ids.iter()), |row| {
            Ok((
                row.get::<_, String>(6)?, // tag_value (resource_id being annotated)
                Resource {
                    id: row.get(0)?,
                    resource_path: row.get(1)?,
                    resource_type: row.get(2)?,
                    created_at: row.get(3)?,
                    updated_at: row.get(4)?,
                    deleted: row.get(5)?,
                },
            ))
        })?;

        let mut result: HashMap<String, Vec<Resource>> = HashMap::new();
        for row in rows {
            let (tag_value, resource) = row.map_err(BackendError::DatabaseError)?;
            result.entry(tag_value).or_default().push(resource);
        }

        Ok(result)
    }

    pub fn list_resource_tags(&self, resource_id: &str) -> BackendResult<Vec<ResourceTag>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, resource_id, tag_name, tag_value FROM resource_tags WHERE resource_id = ?1",
        )?;
        let resource_tags = stmt.query_map(rusqlite::params![resource_id], |row| {
            Ok(ResourceTag {
                id: row.get(0)?,
                resource_id: row.get(1)?,
                tag_name: row.get(2)?,
                tag_value: row.get(3)?,
            })
        })?;
        let mut result = Vec::new();
        for resource_tag in resource_tags {
            result.push(resource_tag?);
        }
        Ok(result)
    }

    pub fn get_resource_tag_by_name(
        &self,
        reesource_id: &str,
        tag_name: &str,
    ) -> BackendResult<Option<String>> {
        let query = "SELECT tag_value FROM resource_tags WHERE resource_id = ?1 AND tag_name = ?2";
        self.conn
            .query_row(query, rusqlite::params![reesource_id, tag_name], |row| {
                row.get(0)
            })
            .optional()
            .map_err(|e| e.into())
    }

    pub fn create_resource_tag_tx(
        tx: &mut rusqlite::Transaction,
        resource_tag: &ResourceTag,
    ) -> BackendResult<()> {
        tx.execute(
            "INSERT INTO resource_tags (id, resource_id, tag_name, tag_value) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(resource_id, tag_name, tag_value) DO NOTHING",
            rusqlite::params![resource_tag.id, resource_tag.resource_id, resource_tag.tag_name, resource_tag.tag_value]
        )?;

        Self::touch_resource_tx(tx, &resource_tag.resource_id)?;

        Ok(())
    }

    pub fn update_resource_tag_by_name_tx(
        tx: &mut rusqlite::Transaction,
        resource_tag: &ResourceTag,
    ) -> BackendResult<()> {
        tx.execute(
            "UPDATE resource_tags SET tag_value = ?3 WHERE resource_id = ?1 AND tag_name = ?2",
            rusqlite::params![
                resource_tag.resource_id,
                resource_tag.tag_name,
                resource_tag.tag_value
            ],
        )?;

        Self::touch_resource_tx(tx, &resource_tag.resource_id)?;

        Ok(())
    }

    pub fn update_resource_tag_tx(
        tx: &mut rusqlite::Transaction,
        resource_tag: &ResourceTag,
    ) -> BackendResult<()> {
        tx.execute(
            "UPDATE resource_tags SET resource_id = ?2, tag_name = ?3, tag_value = ?4 WHERE id = ?1",
            rusqlite::params![resource_tag.id, resource_tag.resource_id, resource_tag.tag_name, resource_tag.tag_value]
        )?;

        Self::touch_resource_tx(tx, &resource_tag.resource_id)?;

        Ok(())
    }

    pub fn remove_resource_tag_tx(tx: &mut rusqlite::Transaction, id: &str) -> BackendResult<()> {
        let resource_id: String = tx.query_row(
            "SELECT resource_id FROM resource_tags WHERE id = ?1",
            rusqlite::params![id],
            |row| row.get(0),
        )?;

        tx.execute(
            "DELETE FROM resource_tags WHERE id = ?1",
            rusqlite::params![id],
        )?;

        Self::touch_resource_tx(tx, &resource_id)?;

        Ok(())
    }

    pub fn remove_resource_tag_by_tag_name(
        &self,
        resource_id: &str,
        tag_name: &str,
    ) -> BackendResult<()> {
        self.conn.execute(
            "DELETE FROM resource_tags WHERE resource_id = ?1 AND tag_name = ?2",
            rusqlite::params![resource_id, tag_name],
        )?;
        self.touch_resource(resource_id)?;
        Ok(())
    }

    pub fn remove_resource_tag_by_tag_name_tx(
        tx: &mut rusqlite::Transaction,
        resource_id: &str,
        tag_name: &str,
    ) -> BackendResult<()> {
        tx.execute(
            "DELETE FROM resource_tags WHERE resource_id = ?1 AND tag_name = ?2",
            rusqlite::params![resource_id, tag_name],
        )?;

        Self::touch_resource_tx(tx, resource_id)?;

        Ok(())
    }

    pub fn list_resource_ids_by_tags(
        &self,
        tags: &Vec<ResourceTagFilter>,
    ) -> BackendResult<Vec<String>> {
        let mut result = Vec::new();
        if tags.is_empty() {
            return Ok(result);
        }
        let (query, params) = list_resource_ids_by_tags_query(tags, 0);
        let mut stmt = self.conn.prepare(&query)?;
        let resource_ids =
            stmt.query_map(rusqlite::params_from_iter(params.iter()), |row| row.get(0))?;
        for resource_id in resource_ids {
            result.push(resource_id?);
        }
        Ok(result)
    }

    pub fn list_resource_ids_by_tags_space_id(
        &self,
        tags: &Vec<ResourceTagFilter>,
        space_id: &str,
    ) -> BackendResult<Vec<String>> {
        if tags.is_empty() {
            return self.list_resource_ids_by_space_id(space_id);
        }
        let mut result = Vec::new();
        let (mut query, mut params) = list_resource_ids_by_tags_query(tags, 0);

        query = format!(
            "{} INTERSECT SELECT resource_id FROM space_entries WHERE space_id = ?",
            query
        );
        params.push(space_id.to_string());

        let mut stmt = self.conn.prepare(&query)?;
        let resource_ids =
            stmt.query_map(rusqlite::params_from_iter(params.iter()), |row| row.get(0))?;
        for resource_id in resource_ids {
            result.push(resource_id?);
        }
        Ok(result)
    }

    pub fn list_resource_ids_by_tags_no_space(
        &self,
        tags: &Vec<ResourceTagFilter>,
    ) -> BackendResult<Vec<String>> {
        if tags.is_empty() {
            return Ok(Vec::new());
        }
        let mut result = Vec::new();
        let (query, params) = list_resource_ids_by_tags_query(tags, 0);

        let final_query = format!(
        "SELECT rt.resource_id FROM ({}) rt 
         JOIN resources r ON rt.resource_id = r.id 
         WHERE rt.resource_id NOT IN (SELECT resource_id FROM space_entries WHERE manually_added = 1)
         ORDER BY r.created_at DESC",
        query
    );

        let mut stmt = self.conn.prepare(&final_query)?;
        let resource_ids =
            stmt.query_map(rusqlite::params_from_iter(params.iter()), |row| row.get(0))?;
        for resource_id in resource_ids {
            result.push(resource_id?);
        }
        Ok(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_resource_ids_by_tags_query() {
        let tags = vec![ResourceTagFilter {
            tag_name: "tag1".to_string(),
            tag_value: "value1".to_string(),
            op: ResourceTagFilterOp::Eq,
        }];
        let (query, params) = list_resource_ids_by_tags_query(&tags, 0);
        assert_eq!(
            query,
            "SELECT resource_id FROM resource_tags WHERE (tag_name = ?1 AND tag_value = ?2)"
        );
        assert_eq!(params, vec!["tag1", "value1"]);

        let tags = vec![
            ResourceTagFilter {
                tag_name: "tag1".to_string(),
                tag_value: "value1".to_string(),
                op: ResourceTagFilterOp::Eq,
            },
            ResourceTagFilter {
                tag_name: "tag2".to_string(),
                tag_value: "value2".to_string(),
                op: ResourceTagFilterOp::Ne,
            },
            ResourceTagFilter {
                tag_name: "tag3".to_string(),
                tag_value: "value".to_string(),
                op: ResourceTagFilterOp::Prefix,
            },
            ResourceTagFilter {
                tag_name: "tag4".to_string(),
                tag_value: "".to_string(),
                op: ResourceTagFilterOp::NotExists,
            },
            ResourceTagFilter {
                tag_name: "tag5".to_string(),
                tag_value: "value".to_string(),
                op: ResourceTagFilterOp::Suffix,
            },
        ];
        let (query, params) = list_resource_ids_by_tags_query(&tags, 0);
        assert_eq!(
            query,
            "SELECT resource_id FROM resource_tags WHERE (tag_name = ?1 AND tag_value = ?2) INTERSECT SELECT resource_id FROM resource_tags WHERE (tag_name = ?3 AND tag_value != ?4) INTERSECT SELECT resource_id FROM resource_tags WHERE (tag_name = ?5 AND tag_value LIKE ?6) INTERSECT SELECT resource_id FROM resource_tags WHERE (resource_id NOT IN (SELECT resource_id FROM resource_tags WHERE tag_name = ?7 AND tag_name = ?8)) INTERSECT SELECT resource_id FROM resource_tags WHERE (tag_name = ?9 AND tag_value LIKE ?10)"
        );
        assert_eq!(
            params,
            vec![
                "tag1", "value1", "tag2", "value2", "tag3", "value%", "tag4", "tag4", "tag5",
                "%value"
            ]
        );

        let (query, params) = list_resource_ids_by_tags_query(&tags, 2);
        assert_eq!(
            query,
            "SELECT resource_id FROM resource_tags WHERE (tag_name = ?3 AND tag_value = ?4) INTERSECT SELECT resource_id FROM resource_tags WHERE (tag_name = ?5 AND tag_value != ?6) INTERSECT SELECT resource_id FROM resource_tags WHERE (tag_name = ?7 AND tag_value LIKE ?8) INTERSECT SELECT resource_id FROM resource_tags WHERE (resource_id NOT IN (SELECT resource_id FROM resource_tags WHERE tag_name = ?9 AND tag_name = ?10)) INTERSECT SELECT resource_id FROM resource_tags WHERE (tag_name = ?11 AND tag_value LIKE ?12)"
        );
        assert_eq!(
            params,
            vec![
                "tag1", "value1", "tag2", "value2", "tag3", "value%", "tag4", "tag4", "tag5",
                "%value"
            ]
        );
    }
}
